"use client";
import { PublicKey } from "../../../contracts/src/minapatrons.js";
import { useEffect, useState } from "react";
import "./reactCOIServiceWorker";
import styles from "../styles/Home.module.css";
import ZkappWorkerClient from "./zkappWorkerClient";
import axios from "axios";

const zkappAddress = "B62qooGF2urAxPhvs6ufW99zA3wifkHx1d1SbEwwBaW8vn3jWUj2Fys";
const transactionFee = 0;

export default function Home() {
  const [state, setState] = useState({
    zkappWorkerClient: null as null | ZkappWorkerClient,
    hasWallet: null as null | boolean,
    hasBeenSetup: false,
    accountExists: false,
    publicKey: null as null | PublicKey,
    zkappPublicKey: null as null | PublicKey,
    creatingTransaction: false,
  });

  const [posts, setPosts] = useState([]);
  const [unlockedPosts, setUnlockedPosts] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    postId: "",
    price: "",
    contentName: "",
    nullifier: "",
    privateKey: "",
    image: null as File | null,
  });

  useEffect(() => {
    const setupZkApp = async () => {
      const { PublicKey } = await import("../../../contracts/src/minapatrons");
      if (!state.hasBeenSetup) {
        const zkappWorkerClient = new ZkappWorkerClient();
        await zkappWorkerClient.setActiveInstanceToDevnet();

        const mina = (window as any).mina;
        if (!mina) {
          setState({ ...state, hasWallet: false });
          return;
        }

        const publicKeyBase58: string = (await mina.requestAccounts())[0];
        const publicKey = PublicKey.fromBase58(publicKeyBase58);

        const zkappPublicKey = PublicKey.fromBase58(zkappAddress);
        await zkappWorkerClient.loadContract();
        await zkappWorkerClient.compileContract();
        await zkappWorkerClient.initZkappInstance(zkappPublicKey.toBase58());

        setState({
          ...state,
          zkappWorkerClient,
          hasWallet: true,
          hasBeenSetup: true,
          publicKey,
          zkappPublicKey,
        });

        const unlockedData = await axios.get("/api/get_content.ts", {
          params: { publickey: state.publicKey!.toBase58() },
        });
        setUnlockedPosts(unlockedData.data.map((post: any) => post.id));
      }
    };
    fetchPosts();
    setupZkApp();
  }, [state]);

  const fetchPosts = async () => {
    try {
      const { data } = await axios.get("/api/get_content");
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("postId", formData.postId);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("contentName", formData.contentName);
      formDataToSend.append("nullifier", formData.nullifier);
      formDataToSend.append("privateKey", formData.privateKey);
      if (formData.image) formDataToSend.append("image", formData.image);

      await axios.post("/api/add_content", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setFormData({
        postId: "",
        price: "",
        contentName: "",
        nullifier: "",
        privateKey: "",
        image: null,
      });

      fetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleBuyPost = async (postId: string, price: string) => {
    try {
      await state.zkappWorkerClient!.fetchAccount(state.publicKey!.toBase58());
      await state.zkappWorkerClient!.createBuyTransaction(
        postId,
        price,
        state.publicKey!.toBase58()
      );
      await state.zkappWorkerClient!.proveUpdateTransaction();

      const transactionJSON =
        await state.zkappWorkerClient!.getTransactionJSON();
      const { hash } = await (window as any).mina.sendTransaction({
        transaction: transactionJSON,
        feePayer: {
          fee: transactionFee,
          memo: "",
        },
      });

      alert(`Transaction successful: https://minaexplorer.com/tx/${hash}`);
      // Add the post to the unlocked posts
      setUnlockedPosts((prev) => [...prev, postId]);
    } catch (error) {
      console.error("Error buying post:", error);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>MINAPATRONS</h1>

      <form className={styles.form} onSubmit={handleCreatePost}>
        <input
          type="text"
          name="price"
          placeholder="Price"
          value={formData.price}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="contentName"
          placeholder="Content Name"
          value={formData.contentName}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="nullifier"
          placeholder="Nullifier"
          value={formData.nullifier}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="privateKey"
          placeholder="Private Key"
          value={formData.privateKey}
          onChange={handleInputChange}
          required
        />
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleInputChange}
          required
        />
        <button type="submit">Create Post</button>
      </form>

      <div className={styles.posts}>
        {posts.map((post: any) => (
          <div key={post.id} className={styles.post}>
            <h2>{post.contentName}</h2>
            <p>Price: {post.price}</p>
            {post.image && (
              <div className={styles.imageWrapper}>
                <img
                  src={`data:image/jpeg;base64,${post.image}`}
                  alt={post.contentName}
                  className={styles.image}
                />
                {!unlockedPosts.includes(post.id) && (
                  <div className={styles.overlay}>
                    <p>Unlocked</p>
                  </div>
                )}
              </div>
            )}
            {!unlockedPosts.includes(post.id) && (
              <button onClick={() => handleBuyPost(post.id, post.price)}>
                Buy & Unlock
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
